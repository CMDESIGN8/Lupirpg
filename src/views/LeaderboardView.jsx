const LeaderboardView = ({ entries=[] }) => (
  <div className="container">
    <div className="card">
      <h3>Ranking</h3>
      <ol>
        {entries.map((e,i)=> (
          <li key={e.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
            <span>#{i+1} {e.username}</span>
            <strong>Lv {e.level}</strong>
          </li>
        ))}
      </ol>
    </div>
  </div>
)
export default LeaderboardView
