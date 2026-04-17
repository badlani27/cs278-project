type Props = { images: string[]; alt: string; className?: string };

export function BoardCover({ images, alt, className = "" }: Props) {
  const imgs = images.filter(Boolean).slice(0, 4);

  if (imgs.length === 0) {
    return (
      <div
        className={`flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-mist via-cream to-blush/40 text-center text-sm text-muted shadow-soft ${className}`}
      >
        <span className="font-display px-4">No artwork yet</span>
      </div>
    );
  }

  if (imgs.length === 1) {
    return (
      <div className={`overflow-hidden rounded-2xl shadow-soft ${className}`}>
        <img src={imgs[0]} alt={alt} className="aspect-[4/3] h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl bg-line shadow-soft ${className}`}
    >
      {imgs.map((src, i) => (
        <img key={`${src}-${i}`} src={src} alt="" className="aspect-square w-full object-cover" />
      ))}
    </div>
  );
}
