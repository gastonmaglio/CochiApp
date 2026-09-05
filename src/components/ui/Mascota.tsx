import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface MascotaProps {
  size?: number;
  className?: string;
}

export function Mascota({ size = 96, className }: MascotaProps) {
  return (
    <Image
      src="/mascota-capibara.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("select-none", className)}
      priority
    />
  );
}
