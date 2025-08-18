import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login, isLoading } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginError('');
    console.log('Login form data:', JSON.stringify(data, null, 2));

    try {
      const success = await login(data.email, data.password);
      if (!success) {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      setLoginError('An error occurred during login');
    }
  };

  const demoAccounts = [
    {
      role: "Property Manager",
      email: "manager@hotelplatform.com",
      password: "manager123",
    },
    { role: "Unit Owner 1", email: "owner1@example.com", password: "owner123" },
    { role: "Unit Owner 2", email: "owner2@example.com", password: "owner123" },

    {
      role: "Customer 1",
      email: "customer@example.com",
      password: "customer123",
    },
    {
      role: "Customer 2",
      email: "alice@example.com",
      password: "customer123",
    },
  ];

  const fillDemo = (email: string, password: string) => {
    form.setValue('email', email);
    form.setValue('password', password);
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={onSwitchToRegister}
                >
                  Sign up here
                </Button>
              </p>
            </div>

            <div className="mt-8">
              <div className="text-sm text-muted-foreground text-center mb-4">
                Demo Accounts (Click to fill)
              </div>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <Button
                    key={account.role}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => fillDemo(account.email, account.password)}
                  >
                    <div>
                      <div className="font-medium">{account.role}</div>
                      <div className="text-sm text-muted-foreground">{account.email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;