type TabsContainerProps = {
  selectedTab: 'charts' | 'table'
  setSelectedTab: React.Dispatch<React.SetStateAction<'charts' | 'table'>>
}

export const TabsContainer = ({ selectedTab, setSelectedTab }: TabsContainerProps) => {
  const items = [
    { id: 'charts', label: 'Dashboard Tool' },
    { id: 'table', label: 'Table' },
  ]

  return (
    <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 m-4">
      <ul className="flex flex-wrap justify-center">
        {items.map((item) => (
          <li key={item.id} className="me-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setSelectedTab(item.id as 'charts' | 'table')
              }}
              className={`inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 ${
                item.id === selectedTab
                  ? 'text-blue-600 border-blue-600 active'
                  : 'border-transparent'
              }`}
              aria-current={item.id === selectedTab ? 'page' : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
