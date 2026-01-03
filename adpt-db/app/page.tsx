import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full max-h-max flex flex-col justify-center items-center">
      <h1 className="text-4xl">Synsnera</h1>
        <Link href={'/login'}><button className="w-30 h-10 text-2xl bg-blue-900 rounded-full text-amber-50">SignIn</button></Link>
    </div>
  );
}
