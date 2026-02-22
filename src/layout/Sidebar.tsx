import { Outlet, Link } from 'react-router-dom'
import ThirdWebConnect from '../components/ThirdWebConnect'

export default function Sidebar() {
  const routes = [
    { id: 1, name: 'Home', path: '/' },
    { id: 2, name: 'Data Qube', path: 'dataqube' },
    { id: 3, name: 'Content Qube', path: 'contentqube' },
    { id: 4, name: 'Agent Qube', path: 'agent' },
    { id: 6, name: 'Transfer Qube', path: 'transfer' },
    { id: 7, name: 'Cross Chain', path: 'crosschain' },
  ]

  return (
    <div className="">
      {/* sidebar */}
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white p-[20px]">
        <p className="text-[20px] font-bold mb-[70px]">Navigation</p>

        {routes.map((route) => (
          <Link
            to={route.path}
            key={route.id}
            className="text-black hover:font-bold block mb-[30px] hover:text-blue-500 hover:underline hover:bg-gray-100 p-[10px] rounded-[10px]"
          >
            {route.name}
          </Link>
        ))}

        <ThirdWebConnect />
      </div>
      {/* content */}

      <div className="ml-[300px]">
        <Outlet />
      </div>
    </div>
  )
}
