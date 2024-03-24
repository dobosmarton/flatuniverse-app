export default async function About() {
  return (
    <div className="flex flex-col px-8 py-12 sm:py-16  gap-4">
      <h1 className="text-2xl">About the project</h1>

      <div className="flex flex-col gap-4 text-muted-foreground">
        <span>
          This goal of this project is to provide a user-friendly interface for everyone who is interested in science
          research papers. Additionaly it provides extra features to help users to find the papers they are looking for.
        </span>
        <span>The research papers are fetched from the arXiv API and are updated regularly.</span>
      </div>
    </div>
  );
}
