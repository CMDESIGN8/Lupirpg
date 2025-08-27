import { CornerUpRight, ChevronDown } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const TransferView = ({ lupiCoins, handleTransferCoins, recipientAddress, setRecipientAddress, transferAmount, setTransferAmount, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Transferir Lupi Coins</h2>
      <MessageDisplay message={message} />
      <p className="text-center mb-4 text-gray-700">Tu saldo: <span className="text-amber-500">{lupiCoins}</span> Lupi Coins</p>
      <form onSubmit={handleTransferCoins} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección del Destinatario</label>
          <div className="flex mt-1">
            <input type="text" placeholder="nombredeusuario" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="flex-1 p-2 bg-gray-50 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required />
            <span className="p-2 border-y border-r border-gray-300 bg-gray-200 text-gray-600 rounded-r-md">.lupi</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad a Transferir</label>
          <input type="number" placeholder="100" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required />
        </div>
        <ThemedButton type="submit" disabled={loading} icon={<CornerUpRight size={20} />} className="w-full bg-purple-600 hover:bg-purple-500">
          {loading ? 'Transfiriendo...' : 'Confirmar Transferencia'}
        </ThemedButton>
      </form>
      <div className="flex justify-center mt-6">
        <ThemedButton onClick={() => setView('dashboard')} icon={<ChevronDown size={20} />}>Volver</ThemedButton>
      </div>
    </div>
  </div>
);

export default TransferView;