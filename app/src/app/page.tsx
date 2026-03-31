import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Perspectives</h1>
        <p className="text-sm text-gray-500 mb-8">
          Choose how you'd like to sign in.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/student"
            className="block w-full py-3 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            I'm a Student
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-3 px-4 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            I'm a Teacher
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-3 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            I'm a Researcher
          </Link>
        </div>
      </div>
    </div>
  );
}
