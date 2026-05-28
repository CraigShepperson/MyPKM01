interface NoteTitleProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
}

export function NoteTitle({ value, onChange, onEnter }: NoteTitleProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className="text-[2em] font-bold leading-[1.3] w-full outline-none bg-transparent px-[54px] pt-8 pb-2"
      placeholder="Untitled"
    />
  );
}
