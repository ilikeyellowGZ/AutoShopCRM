type WeeleeLogoProps = { className?: string; width?: number; height?: number };

export function WeeleeLogo({ className, width = 168, height = 44 }: WeeleeLogoProps) {
  return <img className={className} src="/media/brand/weelee-logo-transparent.png" width={width} height={height} alt="Weelee" />;
}
