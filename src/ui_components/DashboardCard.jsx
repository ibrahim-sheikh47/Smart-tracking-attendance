import React from 'react'

const DashboardCard = ({title, value, icon}) => {
    return (
        <div className="bg-[#FEFEFE] border border-[#E9EAEA] rounded-2xl
                            flex flex-col w-full h-[140px] p-3 mr-4">

            <div className="flex justify-between items-center">
                <h4 className="text-lg">{title}</h4>
                <img src={icon}/>
            </div>
            <h1 className="text-3xl mt-auto">{value}</h1>
        </div>
    )
}
export default DashboardCard
