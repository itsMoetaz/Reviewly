import { AuthLayout } from "./components/AuthLayout";
import { LoginForm } from "./components/LoginForm";

export const LoginPage = () => {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Reviewly account"
    >
      <LoginForm />
    </AuthLayout>
  );
};
