type NPLogoProps = {
  size?: number;
};

export default function NPLogo({ size = 44 }: NPLogoProps) {
  return (
    <img
      src="/np-symbol.png"
      alt="Logo NP FloodCanTho"
      width={size}
      height={size}
      className="object-contain"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}