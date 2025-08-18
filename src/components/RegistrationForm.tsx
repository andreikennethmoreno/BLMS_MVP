import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { registrationSchema, type RegistrationFormData } from '@/lib/validations';
import usersData from '../data/users.json';

interface RegistrationFormProps {
  onSwitchToLogin: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSwitchToLogin }) => {
  const [users, setUsers] = useLocalStorage('users', usersData.users);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = useCallback(async (data: RegistrationFormData, isMerchant = false) => {

    // Check if email already exists
    if (users.some(user => user.email === data.email)) {
      form.setError('email', { message: 'Email already exists' });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const newUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        password: data.password,
        role: isMerchant ? 'unit_owner' : 'customer',
        name: data.name,
        verified: isMerchant ? false : true, // Merchants need verification
        createdAt: new Date().toISOString()
      };

      setUsers([...users, newUser]);
      
      alert(`Registration successful! ${isMerchant ? 'Your merchant account will be reviewed by our team.' : 'You can now log in.'}`);
      onSwitchToLogin();
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [users, setUsers, onSwitchToLogin, form]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Join our hotel booking platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email address" {...field} />
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
                            placeholder="Create a password"
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
                      <FormDescription>
                        Password must be at least 6 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
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

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Button
                  type="button"
                  onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                  disabled={isSubmitting}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  <Building className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Creating Merchant Account...' : 'Register as Merchant'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={onSwitchToLogin}
                >
                  Sign in here
                </Button>
              </p>
            </div>

            <Alert className="mt-6">
              <AlertDescription className="text-xs">
                <p><strong>Customer Account:</strong> Browse and book properties</p>
                <p><strong>Merchant Account:</strong> List and manage your own properties (requires approval)</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationForm;