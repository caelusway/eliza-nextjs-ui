'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ActionButtonsProps {
  className?: string;
}

export const ActionButtons = ({ className = '' }: ActionButtonsProps) => {
  const router = useRouter();

  const handleLaunchAubrai = () => {
    // Navigate to chat interface
    router.push('/chat');
  };

  const handleJoinFundraise = () => {
    // Navigate to fundraise page (to be implemented)
    router.push('/fundraise');
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-center justify-center ${className}`}>
      <Button
        onClick={handleLaunchAubrai}
        color="blue"
        className="px-6 py-3 text-sm sm:text-base font-medium min-w-[160px]"
      >
        LAUNCH AUBRAI _
      </Button>

      <Button
        onClick={handleJoinFundraise}
        color="dark"
        className="px-6 py-3 text-sm sm:text-base font-medium min-w-[160px] flex items-center gap-2"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M2 6L6 2L10 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Join the Fundraise
      </Button>
    </div>
  );
};
