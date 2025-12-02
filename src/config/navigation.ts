export type NavLink = {
  href: string;
  label: string;
};

export const appNavLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/puzzles/create", label: "Create puzzle" },
  { href: "/invites", label: "Invites" },
];
