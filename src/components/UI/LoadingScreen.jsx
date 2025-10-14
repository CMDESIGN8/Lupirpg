const LoadingScreen = () => (
  <div className="loading-stadium">
    <div className="loading-content">
      <div className="soccer-ball">
        <div className="ball">
          <div className="hexagon"></div>
          <div className="hexagon"></div>
          <div className="hexagon"></div>
        </div>
      </div>
      <p className="loading-text">Cargando Estadio...</p>
      <div className="field-lines"></div>
    </div>
  </div>
);

export default LoadingScreen;