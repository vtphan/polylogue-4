import JoinForm from "./join-form";

export default function StudentJoinPage() {
  return (
    <div className="student-ui min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-8">
        <h1 className="text-[22px] font-bold text-gray-900 text-center mb-2">
          Perspectives
        </h1>
        <p className="text-[15px] text-gray-500 text-center mb-6">
          Enter your session code and name to get started.
        </p>
        <JoinForm />
      </div>
    </div>
  );
}
