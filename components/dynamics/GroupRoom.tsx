import React, { useState } from 'react';
import { Dynamic, DynamicGroup } from '../../types';

interface GroupRoomProps {
    dynamics: Dynamic[];
    onUpdateDynamic: (dynamic: Dynamic) => void;
}

const GroupRoom: React.FC<GroupRoomProps> = ({ dynamics, onUpdateDynamic }) => {
    const [groupId, setGroupId] = useState('');
    const [error, setError] = useState('');
    const [foundGroup, setFoundGroup] = useState<{ dynamic: Dynamic, group: DynamicGroup } | null>(null);
    const [summary, setSummary] = useState('');

    const handleFindGroup = () => {
        setError('');
        const idToFind = groupId.trim().toLowerCase();
        if (!idToFind) {
            setError('Por favor, insira um ID de grupo.');
            return;
        }

        for (const dynamic of dynamics) {
            for (const group of dynamic.groups) {
                if (group.simpleId?.toLowerCase() === idToFind) {
                    setFoundGroup({ dynamic, group });
                    setSummary(group.groupSummary || '');
                    return;
                }
            }
        }
        setError('Grupo não encontrado. Verifique o ID e tente novamente.');
    };

    const handleSubmitSummary = () => {
        if (foundGroup) {
            const updatedGroup = { ...foundGroup.group, groupSummary: summary };
            const updatedGroups = foundGroup.dynamic.groups.map(g => g.name === updatedGroup.name ? updatedGroup : g);
            const updatedDynamic = { ...foundGroup.dynamic, groups: updatedGroups };
            onUpdateDynamic(updatedDynamic);
            alert('Resumo enviado com sucesso!');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            {!foundGroup ? (
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-4">Sala da Dinâmica</h1>
                    <p className="mb-4">Insira o ID do seu grupo para acessar as instruções e o campo de anotações.</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            placeholder="Ex: grupo-001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={handleFindGroup}
                            className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Acessar
                        </button>
                    </div>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            ) : (
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-2">{foundGroup.dynamic.title}</h1>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Grupo: {foundGroup.group.name}</h2>

                    <div className="mb-6">
                        <h3 className="font-bold text-lg mb-2">Instruções</h3>
                        <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                            {foundGroup.dynamic.script || "Nenhuma instrução fornecida."}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2">Resumo do Grupo</h3>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            rows={10}
                            placeholder="Escreva aqui as conclusões e o resumo do seu grupo..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSubmitSummary}
                            className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Enviar Resumo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupRoom;
