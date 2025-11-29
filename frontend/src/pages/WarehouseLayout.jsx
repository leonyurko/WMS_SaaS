import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';

const WarehouseLayout = () => {
    const { setPageTitle } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('Small'); // Small or Large
    const [layout, setLayout] = useState({
        Small: [],
        Large: []
    });

    useEffect(() => {
        setPageTitle('Warehouse Layout Configuration');
        fetchLayouts();
    }, [setPageTitle]);

    const fetchLayouts = async () => {
        try {
            setLoading(true);
            const [smallRes, largeRes] = await Promise.all([
                api.get('/layouts/Small'),
                api.get('/layouts/Large')
            ]);

            setLayout({
                Small: smallRes.data.data.structure || [],
                Large: largeRes.data.data.structure || []
            });
        } catch (err) {
            console.error('Failed to fetch layouts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRowCountChange = (count) => {
        const newStructure = [...layout[activeTab]];
        if (count > newStructure.length) {
            // Add rows
            for (let i = newStructure.length; i < count; i++) {
                newStructure.push({ name: `Row ${i + 1}`, columns: 0, columnNames: [] });
            }
        } else {
            // Remove rows
            newStructure.splice(count);
        }
        setLayout(prev => ({ ...prev, [activeTab]: newStructure }));
    };

    const handleRowNameChange = (index, name) => {
        const newStructure = [...layout[activeTab]];
        newStructure[index].name = name;
        setLayout(prev => ({ ...prev, [activeTab]: newStructure }));
    };

    const handleColCountChange = (rowIndex, count) => {
        const newStructure = [...layout[activeTab]];
        const row = newStructure[rowIndex];
        row.columns = count;

        // Adjust column names array
        if (count > row.columnNames.length) {
            for (let i = row.columnNames.length; i < count; i++) {
                row.columnNames.push(`Col ${i + 1}`);
            }
        } else {
            row.columnNames.splice(count);
        }

        setLayout(prev => ({ ...prev, [activeTab]: newStructure }));
    };

    const handleColNameChange = (rowIndex, colIndex, name) => {
        const newStructure = [...layout[activeTab]];
        newStructure[rowIndex].columnNames[colIndex] = name;
        setLayout(prev => ({ ...prev, [activeTab]: newStructure }));
    };

    const saveLayout = async () => {
        try {
            setSaving(true);
            await api.post('/layouts', {
                warehouseName: activeTab,
                structure: layout[activeTab]
            });
            alert('Layout saved successfully!');
        } catch (err) {
            console.error('Failed to save layout', err);
            alert('Failed to save layout');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'Small' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('Small')}
                >
                    Small Warehouse
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'Large' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('Large')}
                >
                    Large Warehouse
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rows (Shelves)</label>
                <select
                    className="border rounded px-3 py-2 w-32"
                    value={layout[activeTab].length}
                    onChange={(e) => handleRowCountChange(parseInt(e.target.value))}
                >
                    {[...Array(100).keys()].map(i => (
                        <option key={i} value={i}>{i}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-6">
                {layout[activeTab].map((row, rowIndex) => (
                    <div key={rowIndex} className="border p-4 rounded bg-gray-50">
                        <div className="flex gap-4 mb-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Row Name</label>
                                <input
                                    type="text"
                                    className="border rounded px-3 py-2 w-full"
                                    value={row.name}
                                    onChange={(e) => handleRowNameChange(rowIndex, e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Columns</label>
                                <select
                                    className="border rounded px-3 py-2 w-24"
                                    value={row.columns}
                                    onChange={(e) => handleColCountChange(rowIndex, parseInt(e.target.value))}
                                >
                                    {[...Array(100).keys()].map(i => (
                                        <option key={i} value={i}>{i}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {row.columns > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-4 border-l-2 border-blue-200">
                                {row.columnNames.map((colName, colIndex) => (
                                    <div key={colIndex}>
                                        <input
                                            type="text"
                                            className="border rounded px-2 py-1 w-full text-sm"
                                            value={colName}
                                            onChange={(e) => handleColNameChange(rowIndex, colIndex, e.target.value)}
                                            placeholder={`Col ${colIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={saveLayout}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
};

export default WarehouseLayout;
