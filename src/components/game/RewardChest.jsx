// src/components/game/RewardChest.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const Chest = ({ reward, onClose }) => {
  const [opened, setOpened] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 shadow-xl w-96 text-center"
      >
        {!opened ? (
          <>
            <h3 className="text-2xl font-bold mb-4">¡Has obtenido un cofre! 🎁</h3>
            <p className="mb-6">Haz clic para abrir y ver tu recompensa.</p>
            <button
              onClick={() => setOpened(true)}
              className="px-6 py-2 rounded bg-yellow-400 font-bold"
            >
              Abrir Cofre
            </button>
            <button onClick={onClose} className="ml-3 px-4 py-2 rounded border">Cerrar</button>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold mb-3">Recompensa</h3>
            <div className="mb-4">
              <div className="text-lg font-semibold">{reward?.name}</div>
              {reward?.skill_bonus && (
                <div className="text-sm text-gray-600">{reward.skill_bonus} +{reward.bonus_value}</div>
              )}
            </div>
            <button onClick={onClose} className="mt-3 px-6 py-2 rounded bg-green-500 text-white">
              Aceptar
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Chest;
