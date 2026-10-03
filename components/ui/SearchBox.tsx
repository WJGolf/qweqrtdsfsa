export default function SearchBox() {
  return (
    <form action="/search" className="flex-1 md:max-w-md">
      <input name="q" type="search" placeholder="Search characters, skills, abilities, stages" className="input" aria-label="Search" />
    </form>
  );
}
