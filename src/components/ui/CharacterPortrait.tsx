/* eslint-disable @next/next/no-img-element */


interface CharacterPortraitProps {
  characterId: number;
  characterName: string;
}

export function CharacterPortrait({ characterId, characterName }: CharacterPortraitProps) {
  return (
    <div className="w-24 h-24 border border-zinc-800 bg-zinc-900 flex-shrink-0">
      {/* Next.js <Image> is banned per architecture rules, using standard <img> */}
      <img 
        src={`https://images.evetech.net/characters/${characterId}/portrait?size=128`} 
        alt={`${characterName} portrait`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
