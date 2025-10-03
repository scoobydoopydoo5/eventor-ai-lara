import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface EventPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isSettingPassword?: boolean;
}

export function EventPasswordModal({ 
  open, 
  onClose, 
  onSubmit,
  isSettingPassword = false 
}: EventPasswordModalProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password.trim()) {
      onSubmit(password);
      setPassword('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {isSettingPassword ? 'Set Event Password' : 'Password Required'}
          </DialogTitle>
          <DialogDescription>
            {isSettingPassword 
              ? 'Set a password to protect your event from unauthorized access'
              : 'This event is password protected. Enter the password to continue.'}
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isSettingPassword ? 'Set Password' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
