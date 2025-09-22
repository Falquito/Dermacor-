export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-8">
          CareLink
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de gestión de salud y cuidado
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Next.js 15
            </h3>
            <p className="text-gray-600">
              Framework React con App Router
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              TypeScript
            </h3>
            <p className="text-gray-600">
              Tipado estático para JavaScript
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tailwind CSS
            </h3>
            <p className="text-gray-600">
              Framework CSS utility-first
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Prisma
            </h3>
            <p className="text-gray-600">
              ORM moderno para bases de datos
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              PostgreSQL
            </h3>
            <p className="text-gray-600">
              Base de datos relacional
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Docker
            </h3>
            <p className="text-gray-600">
              Contenerización y desarrollo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}