import { ChevronUp } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import { sports, positionsBySport  } from '../../constants';
import '../styles/CreateCharacterView.css';

const CreateCharacterView = ({ handleCreateAccount, setUsername, setSport, setPosition, handleSkillChange, username, sport, position, skills, availablePoints, loading, message }) => (
  <div className="create-character-container">
    <div className="create-character-box">
      <div className="create-character-title">
        <h2>Crea Tu Personaje</h2>
      </div>
      
      <MessageDisplay message={message} />
      
      <form onSubmit={handleCreateAccount} className="create-character-form">
        <div className="form-group">
          <label className="form-label">Nombre de Usuario</label>
          <input 
            type="text" 
            placeholder="Nombre de Usuario" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="form-input" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Deporte</label>
          <select 
            value={sport} 
            onChange={(e) => setSport(e.target.value)} 
            className="form-select"
          >
            {sports.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        <div className="form-group">
  <label className="form-label">Posición</label>
  <select 
    value={position} 
    onChange={(e) => setPosition(e.target.value)} 
    className="form-select"
    disabled={!sport} // se desactiva hasta elegir deporte
  >
    <option value="">Selecciona una posición</option>
    {sport && positionsBySport[sport].map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</div>

        
        <div className="skills-section">
          <div className="skills-header">
            <h4 className="skills-title">Asignar Puntos de Habilidad</h4>
            <p className="skills-subtitle">
              Puntos disponibles: <span className="points-available">{availablePoints}</span>
            </p>
          </div>
          
          <div className="skills-grid">
            {Object.entries(skills).map(([skillName, skillValue]) => (
              <div key={skillName} className="skill-item">
                <span className="skill-name">
                  {skillName}: <span className="skill-value">{skillValue}</span>
                </span>
                <button 
                  type="button" 
                  onClick={() => handleSkillChange(skillName, 1)} 
                  disabled={availablePoints <= 0} 
                  className="skill-upgrade-btn"
                  title="Aumentar habilidad"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || availablePoints > 0} 
          className="submit-btn"
        >
          {loading ? 'Cargando...' : 'Crear Personaje'}
        </button>
      </form>
    </div>
  </div>
);

export default CreateCharacterView;