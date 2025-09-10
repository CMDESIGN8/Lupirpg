// src/components/Club/CreateMissionModal.jsx
import { useState } from 'react';
import ThemedButton from '../UI/ThemedButton';
import Modal from '../UI/Modal';

const CreateMissionModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mission_type: 'daily',
    goal: 10,
    reward: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    if (success) {
      setFormData({
        name: '',
        description: '',
        mission_type: 'daily',
        goal: 10,
        reward: ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'goal' ? parseInt(value) : value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Misión">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la misión
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de misión
          </label>
          <select
            name="mission_type"
            value={formData.mission_type}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta (número de contribuciones necesarias)
          </label>
          <input
            type="number"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            min="1"
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recompensa
          </label>
          <input
            type="text"
            name="reward"
            value={formData.reward}
            onChange={handleChange}
            placeholder="Ej: Pack de 5 pelotas"
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <ThemedButton
            type="button"
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-400"
          >
            Cancelar
          </ThemedButton>
          <ThemedButton
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-500"
          >
            {loading ? 'Creando...' : 'Crear Misión'}
          </ThemedButton>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMissionModal;