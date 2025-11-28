import { AuthLayout } from "./components/AuthLayout";
import { RegisterForm } from "./components/RegisterForm";

export const RegisterPage = () => {
  return (
    <AuthLayout
      title="Create your account"
      subtitle=""
    >
      <RegisterForm />
    </AuthLayout>
  );
};
