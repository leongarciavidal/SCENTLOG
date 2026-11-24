import { Avatar } from "@/components/profile/Avatar";
import { Link } from "@/i18n/navigation";

import { FollowButton } from "./FollowButton";

type Person = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export function PeopleList({
  people,
  viewerId,
  followedIds,
}: {
  people: Person[];
  viewerId: string | null;
  followedIds: Set<string>;
}) {
  return (
    <ul className="flex flex-col divide-y divide-line border-y border-line">
      {people.map((person) => {
        const name = person.display_name || person.username;
        return (
          <li key={person.id} className="flex items-center gap-5 py-5">
            <Link href={`/${person.username}`} className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar url={person.avatar_url} name={name} size="md" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-serif text-2xl leading-none">{name}</span>
                <span className="text-xs text-paper-faint">@{person.username}</span>
                {person.bio ? (
                  <span className="truncate text-sm text-paper-muted">{person.bio}</span>
                ) : null}
              </span>
            </Link>
            {viewerId && viewerId !== person.id ? (
              <FollowButton
                targetId={person.id}
                following={followedIds.has(person.id)}
                size="small"
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
