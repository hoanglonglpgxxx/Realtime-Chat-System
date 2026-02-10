name: Deploy Chat System

on:
push:
branches: ["main"]
workflow_dispatch: # Cho phép bấm nút chạy thủ công để update env/config

jobs:
build-and-deploy:
runs-on: ubuntu-latest
steps: - name: Checkout code
uses: actions/checkout@v3

      # 1. Kiểm tra thay đổi folder
      - name: Check for changes
        uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            backend:
              - 'apps/backend/**'
            frontend:
              - 'apps/frontend/**'
            socket-bridge:
              - 'apps/socket-bridge/**'
            infra:
              - 'infrastructure/**'
            compose:
              - 'apps/docker-compose.yml'

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # 2. Build Images (Chỉ build cái nào thay đổi)
      - name: Build and Push Backend
        if: steps.changes.outputs.backend == 'true'
        uses: docker/build-push-action@v4
        with:
          context: ./apps/backend
          file: ./apps/backend/Dockerfile
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/chat-backend:latest

      - name: Build and Push Frontend
        if: steps.changes.outputs.frontend == 'true'
        uses: docker/build-push-action@v4
        with:
          context: ./apps/frontend
          file: ./apps/frontend/Dockerfile
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/chat-frontend:latest

      - name: Build and Push Socket Bridge
        if: steps.changes.outputs.socket-bridge == 'true'
        uses: docker/build-push-action@v4
        with:
          context: ./apps/socket-bridge
          file: ./apps/socket-bridge/Dockerfile
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/chat-socket-bridge:latest

      # 3. Cấu hình VM 1 (Web Server)
      - name: Deploy to VM 1
        if: github.event_name == 'workflow_dispatch' || steps.changes.outputs.backend == 'true' || steps.changes.outputs.frontend == 'true' || steps.changes.outputs.compose == 'true'
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VM1_PUBLIC_IP }}
          username: mitsne
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/mitsne/realtime-chat/apps

            # Tạo .env với REDIS_PORT=43816
            echo "BE_PORT=${{ secrets.BE_PORT }}" > .env
            echo "FE_PORT=${{ secrets.FE_PORT }}" >> .env
            echo "REDIS_PORT=${{ secrets.REDIS_PORT }}" >> .env
            echo "VM2_INTERNAL_IP=${{ secrets.VM2_INTERNAL_IP }}" >> .env
            echo "MONGO_USER=${{ secrets.MONGO_USER }}" >> .env
            echo "MONGO_PASS=${{ secrets.MONGO_PASS }}" >> .env
            echo "REDIS_PASS=${{ secrets.REDIS_PASS }}" >> .env
            echo "NODE_ENV=${{ secrets.NODE_ENV }}" >> .env
            echo 'DB_URI=${{ secrets.DB_URI }}' >> .env
            echo "BE_URL=${{ secrets.BE_URL }}" >> .env

            docker compose pull
            docker compose up -d --remove-orphans

      # 4. Bridge Socket Bridge Image sang VM 2 (Vì VM 2 nằm vùng nội bộ)
      - name: Bridge Socket Image to VM 2
        if: steps.changes.outputs.socket-bridge == 'true'
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VM1_PUBLIC_IP }}
          username: mitsne
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker pull ${{ secrets.DOCKERHUB_USERNAME }}/chat-socket-bridge:latest
            docker save -o socket_bridge.tar ${{ secrets.DOCKERHUB_USERNAME }}/chat-socket-bridge:latest

            echo "${{ secrets.SSH_PRIVATE_KEY }}" > id_rsa_temp && chmod 600 id_rsa_temp
            scp -i id_rsa_temp -o "StrictHostKeyChecking=no" socket_bridge.tar mitsne@${{ secrets.VM2_INTERNAL_IP }}:/home/mitsne/realtime-chat/infrastructure/
            rm id_rsa_temp socket_bridge.tar

      # 5. Cấu hình VM 2 (Database & Socket Bridge)
      - name: Restart Services on VM 2
        if: github.event_name == 'workflow_dispatch' || steps.changes.outputs.socket-bridge == 'true' || steps.changes.outputs.infra == 'true'
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VM1_PUBLIC_IP }}
          username: mitsne
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            echo "${{ secrets.SSH_PRIVATE_KEY }}" > id_rsa_temp && chmod 600 id_rsa_temp
            ssh -i id_rsa_temp -o "StrictHostKeyChecking=no" mitsne@${{ secrets.VM2_INTERNAL_IP }} "
                cd /home/mitsne/realtime-chat/infrastructure

                if [ -f socket_bridge.tar ]; then
                  docker load -i socket_bridge.tar && rm socket_bridge.tar
                fi

                # Cập nhật .env cho VM 2 (Quan trọng: REDIS_PORT=43816)
                echo 'MONGO_USER=${{ secrets.MONGO_USER }}' > .env
                echo 'MONGO_PASS=${{ secrets.MONGO_PASS }}' >> .env
                echo 'REDIS_PASS=${{ secrets.REDIS_PASS }}' >> .env
                echo 'REDIS_PORT=${{ secrets.REDIS_PORT }}' >> .env
                echo 'DB_URI=${{ secrets.DB_URI }}' >> .env

                docker compose up -d --remove-orphans
            "
            rm id_rsa_temp
