import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';

export default function SignInFormSkeleton() {
  return (
    <Card className="border-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl"><Skeleton className="w-2/3 mx-auto h-[32px] rounded-md" /></CardTitle>
        <CardDescription className="text-base">
          <Skeleton className="w-3/4 mx-auto h-[24px]" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full h-[38px]" />
      </CardContent>
    </Card>
  );
}
