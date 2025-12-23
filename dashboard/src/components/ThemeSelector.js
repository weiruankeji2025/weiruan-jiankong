import React from 'react';
import { themes } from '../themes';
import './ThemeSelector.css';

function ThemeSelector({ currentTheme, onThemeChange }) {
  const themeIcons = {
    deepSpace: '🌌',
    cyberpunk: '🌆',
    matrix: '🌿',
    flame: '🔥'
  };

  return (
    <div className="theme-selector">
      {Object.keys(themes).map(themeKey => (
        <button
          key={themeKey}
          className={`theme-btn ${currentTheme === themeKey ? 'active' : ''}`}
          onClick={() => onThemeChange(themeKey)}
          style={{
            background: currentTheme === themeKey ? themes[themeKey].primary : 'transparent',
            borderColor: themes[themeKey].primary,
            color: currentTheme === themeKey ? '#fff' : themes[currentTheme].text
          }}
          title={themes[themeKey].name}
        >
          <span className="theme-icon">{themeIcons[themeKey]}</span>
          <span className="theme-name">{themes[themeKey].name}</span>
        </button>
      ))}
    </div>
  );
}

export default ThemeSelector;
