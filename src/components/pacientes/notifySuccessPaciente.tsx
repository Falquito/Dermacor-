import { CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export default function NotifySuccessComponent({
  open,
  title,
  description
}: {
  open: boolean;
  title: string;
  description: string;
}) {
  if (!open) return null;

    return (
    <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-5 duration-300">
        <Alert className="bg-white border-cyan-500 shadow-2xl flex items-start gap-3">
        <div className="mt-1">
            <CheckCircle2Icon className="h-5 w-5 text-cyan-600" />
        </div>

        <div className="flex-1">
            <AlertTitle className="text-cyan-700 font-semibold mb-1">
            {title}
            </AlertTitle>
            <AlertDescription className="text-slate-600">
            {description}
            </AlertDescription>
        </div>
        </Alert>
    </div>
    );
}