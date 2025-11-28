import { AuthLayout } from "./components/AuthLayout";
import { RegisterForm } from "./components/RegisterForm";

const RegisterPage = () => {
  return (
    <AuthLayout
      title="Create your account"
      subtitle=""
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;

