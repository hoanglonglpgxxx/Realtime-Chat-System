import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 w-full flex justify-center">
                <LoginForm />
            </div>
        </div>
    );
}