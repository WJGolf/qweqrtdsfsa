import CharacterForm from "@/components/admin/CharacterForm";
export default function EditCharacter({ params }: { params: { id: string } }) {
  return (<div><h1 className="mb-4 font-display text-2xl font-bold">Edit character</h1><CharacterForm id={params.id} /></div>);
}
