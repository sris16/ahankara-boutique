import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AuthService } from '@/server/services/auth.service';
import { UnauthorizedError } from '@/utils/errors';
import OnboardingClient from '@/components/account/OnboardingClient';

export const metadata = {
  title: 'Welcome | AHANKARA STUDIOS',
};

export default async function OnboardingPage(props: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const reqHeaders = await headers();
  const searchParams = await props.searchParams;
  
  // Enforce authentication
  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }
  
  const rawTarget = searchParams.redirect || '/account';
  const target = rawTarget.startsWith('/') && !rawTarget.startsWith('//') ? rawTarget : '/account';

  // If phone is not null (either a valid phone or an empty string indicating skipped),
  // they have already completed or explicitly skipped onboarding.
  if (user.phone !== null) {
    redirect(target);
  }

  // Ensure this is actually a Google customer (prevents existing email/password customers
  // from manually navigating here and being treated as new Google customers).
  const { prisma } = await import('@/lib/prisma');
  const googleAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'google' }
  });

  if (!googleAccount) {
    redirect(target);
  }

  return (
    <div className="min-h-[80vh] bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <OnboardingClient 
          userName={user.name || 'Client'} 
          redirectUrl={target} 
        />
      </div>
    </div>
  );
}
