import { SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

export function AuthButton() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return <UserButton afterSignOutUrl="/dashboard" />;
  }

  return (
    <SignInButton mode="modal">
      <Button size="sm">Sign In</Button>
    </SignInButton>
  );
}
