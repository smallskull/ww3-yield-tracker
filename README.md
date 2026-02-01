File Structure:

1) Backend
   backend/
├── src/
│   ├── config/
│   │   ├── constants.js      
│   │   ├── database.js      
│   │   └── redis.js         
│   ├── models/
│   │   └── queries.js        
│   ├── protocols/
│   │   ├── BaseAdapter.js         
│   │   └── UniswapV3Adapter.js   
│   ├── routes/
│   │   ├── index.js          
│   │   └── pools.js          
│   ├── services/
│   │   ├── apyCalculator.js       
│   │   ├── dataRefresher.js      
│   │   ├── graphClient.js        
│   │   ├── poolDiscovery.js       
│   │   └── uniswapFetcher.js      
│   └── utils/
│       └── server.js         
├── .env                     
├── package.json
└── README.md

3) Frontnend
   frontend/
├── src/
│   ├── components/
│   │   ├── ui/                     
│   │   ├── AnimatedNumber.tsx       
│   │   ├── ComparisonChart.tsx     
│   │   ├── DashboardHeader.tsx      
│   │   ├── NavLink.tsx             
│   │   ├── PoolHistoryModal.tsx   
│   │   ├── PoolLimitFilter.tsx    
│   │   └── PoolTable.tsx            
│   ├── hooks/
│   │   ├── use-mobile.tsx          
│   │   ├── use-toast.ts            
│   │   ├── usePoolData.ts          
│   │   └── usePoolHistory.ts       
│   ├── lib/
│   │   └── utils.ts                
│   ├── pages/
│   │   ├── Index.tsx               
│   │   └── NotFound.tsx            
│   ├── types/
│   │   └── pool.ts                 
│   ├── App.tsx                     
│   ├── App.css                     
│   ├── index.css                   
│   └── main.tsx                    
├── public/                         
├── .env.local                      
├── components.json                 
├── index.html                      
├── package.json
├── tsconfig.json                     
└── vite.config.ts                    

4) UI
<img width="1907" height="1073" alt="image" src="https://github.com/user-attachments/assets/a07ef145-6980-4f24-ae28-3a8144aa1938" />

5) Backend
<img width="1920" height="1090" alt="image" src="https://github.com/user-attachments/assets/ae848a89-3447-4603-a3c6-300fbe8a34da" />
(stable pools get chosen from over 200+ pools)

6) Icon/Logo
<img width="1920" height="1090" alt="image" src="https://github.com/user-attachments/assets/2968c2b6-bf20-4796-88bb-43d867eb6ce1" />


7) Hackathon requirement (completed vs exceeded):

    Build a real-time Web3 yield tracking platform that aggregates APY data from one of the protocols given in the list below

    Uniswap v3/v4                                                                                                #Used this
    Aerodrom Finance                                                                                    
    Aave
    Morpho finance
    Pendle
    Curve Finance
    Silo
    (Brownie Points for bringing a USP over these topics)

    Your platform must have these Assets (USDC, USDT, USDE, CevUSD)                                              #Contains all, even more
    Continuously ingest and index on-chain and protocol data with low latency                                    #Done
    Develop a scalable backend with WebSocket support for live updates                                           #WebSocket implementation
    Expose a clean public API for developers to access indexed yield data                                        #clean public API!
    Create a dashboard to compare markets and visualize yield opportunities in real time                         #comparison of markets to visualise yield opportunities IRL
    Brownie Points: Ensure the system is hosted, production-ready, and reliable                                  #not hosted.
    Design the architecture to support future expansion and additional analytics                                 #expansion possible

    EXTRAS- (limit, sorting, graph of individual pool etc.)

8) Tech Stack
Frontend

React 18 - UI framework
TypeScript - Type safety
Vite - Build tool
TailwindCSS - Styling
Framer Motion - Animations
Recharts - Data visualization
Socket.IO Client - WebSocket connection
shadcn/ui - Component library

Backend

Node.js - Runtime
Express - Web framework
Socket.IO - Real-time WebSocket server
PostgreSQL (Supabase) - Database
The Graph - Blockchain data indexing
node-cron - Scheduled tasks
Winston - Logging

Infra

Supabase - Managed PostgreSQL database
The Graph Network - Decentralized indexing protocol
Ethereum Mainnet - Blockchain data source

9) Features

Real-time APY Tracking: Live updates via WebSocket for instant yield changes
Automatic Pool Discovery: Discovers 20-50+ stablecoin pools automatically from Uniswap V3
Historical Charts: View 24-hour APY trends for any pool
Pool Comparison: Compare up to 4 pools side-by-side with live charts
Customizable Limits: Filter by 10, 20, 30, or 50 pools
Sortable Columns: Sort by APY, TVL, Volume, or Fees
Dark Theme UI

10) Tracked Stablecoins

USDC (USD Coin)
USDT (Tether)
USDE (Ethena USDe)
DAI (MakerDAO)
FRAX (Frax Finance)
LUSD (Liquity USD)

