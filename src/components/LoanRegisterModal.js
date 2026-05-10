import { useState, useCallback, useRef } from 'react';

const LoanRegisterModal = ({ isOpen, onClose, onSuccess, mode = 'ENTREGA' }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const debounceTimer = useRef(null);

  // ENTREGA
  const [entregaStep, setEntregaStep] = useState(1);
  const [personSearch, setPersonSearch] = useState('');
  const [personResults, setPersonResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryResults, setInventoryResults] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [daysAssigned, setDaysAssigned] = useState('7');

  // RECEPCION
  const [recepcionStep, setRecepcionStep] = useState(1);
  const [loanSearch, setLoanSearch] = useState('');
  const [loanResults, setLoanResults] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [receiverSearch, setReceiverSearch] = useState('');
  const [receiverResults, setReceiverResults] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState(null);

  // Búsquedas
  const searchPersons = useCallback(async (query) => {
    if (query.length < 2) {
      setPersonResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/persons?search=${encodeURIComponent(query)}&pageSize=10`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPersonResults(data.data || []);
      }
    } catch (err) {
      console.error('Error buscando personas:', err);
      setPersonResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handlePersonSearch = useCallback((value) => {
    setPersonSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchPersons(value);
    }, 300);
  }, [searchPersons]);

  const handleReceiverSearch = useCallback((value) => {
    setReceiverSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchPersons(value);
    }, 300);
  }, [searchPersons]);

  const searchInventory = useCallback(async (query) => {
    if (query.length < 2) {
      setInventoryResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/inventory?search=${encodeURIComponent(query)}&pageSize=10`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const available = (data.data || []).filter((item) => item.stock > 0);
        setInventoryResults(available);
      }
    } catch (err) {
      console.error('Error buscando inventario:', err);
      setInventoryResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInventorySearch = useCallback((value) => {
    setInventorySearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchInventory(value);
    }, 300);
  }, [searchInventory]);

  const searchLoans = useCallback(async (query) => {
    if (query.length < 2) {
      setLoanResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/loans?search=${encodeURIComponent(query)}&pageSize=10`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const active = (data.data || []).filter((loan) => loan.status === 'active');
        setLoanResults(active);
      }
    } catch (err) {
      console.error('Error buscando préstamos:', err);
      setLoanResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleLoanSearch = useCallback((value) => {
    setLoanSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchLoans(value);
    }, 300);
  }, [searchLoans]);

  // Operaciones
  const handleCreateLoan = async () => {
    if (!selectedPerson || !selectedInventory || !daysAssigned) {
      setError('Todos los campos son requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedPerson.id,
          inventoryId: selectedInventory.id,
          daysAssigned: parseInt(daysAssigned, 10),
          dateStart: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error creando préstamo');
      }

      resetModal();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveLoan = async () => {
    if (!selectedLoan || !selectedReceiver) {
      setError('Todos los campos son requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/loans/${selectedLoan.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          receivedById: selectedReceiver.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error recibiendo préstamo');
      }

      resetModal();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentMode(mode);
    setEntregaStep(1);
    setRecepcionStep(1);
    setPersonSearch('');
    setPersonResults([]);
    setSelectedPerson(null);
    setInventorySearch('');
    setInventoryResults([]);
    setSelectedInventory(null);
    setDaysAssigned('7');
    setLoanSearch('');
    setLoanResults([]);
    setSelectedLoan(null);
    setReceiverSearch('');
    setReceiverResults([]);
    setSelectedReceiver(null);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // RENDER ENTREGA
  const renderEntrega = () => {
    if (entregaStep === 1) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Paso 1: Selecciona quién recibe</h3>
          <div>
            <label>Buscar persona (nombre o documento)</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={personSearch}
              onChange={(e) => handlePersonSearch(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
            {searching && <p style={{ margin: '4px 0', fontSize: '0.9em' }}>Buscando...</p>}

            {personResults.length > 0 && (
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', marginTop: '8px' }}>
                {personResults.map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => {
                      setSelectedPerson(person);
                      setPersonSearch('');
                      setPersonResults([]);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      background: '#f9f9f9',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{person.nombre}</div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>{person.documento}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedPerson && (
              <div style={{ padding: '8px', background: '#e8f5e9', borderRadius: '4px', marginTop: '8px' }}>
                <strong>{selectedPerson.nombre}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPerson(null);
                    setPersonSearch('');
                  }}
                  style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer' }}
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCurrentMode('RECEPCION')} style={{ flex: 1, padding: '10px', background: '#f0f0f0' }} disabled={loading}>
              Cambiar a Recepción
            </button>
            <button onClick={() => setEntregaStep(2)} style={{ flex: 1, padding: '10px', background: '#1976d2', color: 'white' }} disabled={!selectedPerson || loading}>
              Siguiente
            </button>
          </div>
        </div>
      );
    }

    if (entregaStep === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Paso 2: Selecciona el recurso</h3>
          <div>
            <label>Buscar recurso (nombre, serie o EAN)</label>
            <input
              type="text"
              placeholder="Ej: Laptop, ABC123"
              value={inventorySearch}
              onChange={(e) => handleInventorySearch(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
            {searching && <p style={{ margin: '4px 0', fontSize: '0.9em' }}>Buscando...</p>}

            {inventoryResults.length > 0 && (
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', marginTop: '8px' }}>
                {inventoryResults.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelectedInventory(item);
                      setInventorySearch('');
                      setInventoryResults([]);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      background: '#f9f9f9',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{item.description}</div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>{item.type} • Stock: {item.stock}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedInventory && (
              <div style={{ padding: '8px', background: '#e8f5e9', borderRadius: '4px', marginTop: '8px' }}>
                <strong>{selectedInventory.description}</strong>
                <div style={{ fontSize: '0.85em', color: '#666' }}>Stock disponible: {selectedInventory.stock}</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInventory(null);
                    setInventorySearch('');
                  }}
                  style={{ marginTop: '8px', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer' }}
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div>
            <label>Días de asignación</label>
            <input
              type="number"
              min="1"
              max="365"
              value={daysAssigned}
              onChange={(e) => setDaysAssigned(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEntregaStep(1)} style={{ flex: 1, padding: '10px', background: '#f0f0f0' }} disabled={loading}>
              Atrás
            </button>
            <button onClick={() => setEntregaStep(3)} style={{ flex: 1, padding: '10px', background: '#1976d2', color: 'white' }} disabled={!selectedInventory || loading}>
              Revisar
            </button>
          </div>
        </div>
      );
    }

    if (entregaStep === 3) {
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + parseInt(daysAssigned, 10));

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Paso 3: Confirma el préstamo</h3>
          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ddd' }}>
              <span>Persona:</span>
              <strong>{selectedPerson?.nombre}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ddd' }}>
              <span>Recurso:</span>
              <strong>{selectedInventory?.description}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ddd' }}>
              <span>Días:</span>
              <strong>{daysAssigned}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>Devolución aproximada:</span>
              <strong>{returnDate.toLocaleDateString('es-ES')}</strong>
            </div>
          </div>

          {error && <div style={{ color: '#d32f2f', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEntregaStep(2)} style={{ flex: 1, padding: '10px', background: '#f0f0f0' }} disabled={loading}>
              Atrás
            </button>
            <button onClick={handleCreateLoan} style={{ flex: 1, padding: '10px', background: '#4CAF50', color: 'white' }} disabled={loading}>
              {loading ? 'Procesando...' : '✓ Confirmar'}
            </button>
          </div>
        </div>
      );
    }
  };

  // RENDER RECEPCION
  const renderRecepcion = () => {
    if (recepcionStep === 1) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Paso 1: Busca el préstamo a recibir</h3>
          <div>
            <label>Buscar préstamo (persona, recurso o serie)</label>
            <input
              type="text"
              placeholder="Ej: Juan, Laptop"
              value={loanSearch}
              onChange={(e) => handleLoanSearch(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
            {searching && <p style={{ margin: '4px 0', fontSize: '0.9em' }}>Buscando...</p>}

            {loanResults.length > 0 && (
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', marginTop: '8px' }}>
                {loanResults.map((loan) => (
                  <button
                    type="button"
                    key={loan.id}
                    onClick={() => {
                      setSelectedLoan(loan);
                      setLoanSearch('');
                      setLoanResults([]);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      background: '#f9f9f9',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{loan.person?.nombre || 'N/A'}</div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {loan.inventory?.description || 'N/A'} • {loan.daysAssigned} días
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedLoan && (
              <div style={{ padding: '8px', background: '#e8f5e9', borderRadius: '4px', marginTop: '8px' }}>
                <strong>{selectedLoan.person?.nombre}</strong>
                <div style={{ fontSize: '0.85em', color: '#666' }}>{selectedLoan.inventory?.description}</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLoan(null);
                    setLoanSearch('');
                  }}
                  style={{ marginTop: '8px', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer' }}
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCurrentMode('ENTREGA')} style={{ flex: 1, padding: '10px', background: '#f0f0f0' }} disabled={loading}>
              Cambiar a Entrega
            </button>
            <button onClick={() => setRecepcionStep(2)} style={{ flex: 1, padding: '10px', background: '#1976d2', color: 'white' }} disabled={!selectedLoan || loading}>
              Siguiente
            </button>
          </div>
        </div>
      );
    }

    if (recepcionStep === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Paso 2: ¿Quién recibe el recurso?</h3>
          <div>
            <label>Buscar persona (nombre o documento)</label>
            <input
              type="text"
              placeholder="Ej: Admin, 12345678"
              value={receiverSearch}
              onChange={(e) => handleReceiverSearch(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
            {searching && <p style={{ margin: '4px 0', fontSize: '0.9em' }}>Buscando...</p>}

            {personResults.length > 0 && (
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', marginTop: '8px' }}>
                {personResults.map((person) => (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => {
                      setSelectedReceiver(person);
                      setReceiverSearch('');
                      setPersonResults([]);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      background: '#f9f9f9',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{person.nombre}</div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>{person.documento}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedReceiver && (
              <div style={{ padding: '8px', background: '#e8f5e9', borderRadius: '4px', marginTop: '8px' }}>
                <strong>{selectedReceiver.nombre}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReceiver(null);
                    setReceiverSearch('');
                  }}
                  style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer' }}
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setRecepcionStep(1)} style={{ flex: 1, padding: '10px', background: '#f0f0f0' }} disabled={loading}>
              Atrás
            </button>
            <button onClick={() => setRecepcionStep(3)} style={{ flex: 1, padding: '10px', background: '#1976d2', color: 'white' }} disabled={!selectedReceiver || loading}>
              Revisar
            </button>
          </div>
        </div>
      );
    }

    if (recepcionStep === 3) {
      const diasPasados = selectedLoan
        ? Math.floor((Date.now() - new Date(selectedLoan.dateStart).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const diasRestantes = selectedLoan ? selectedLoan.daysAssigned - diasPasados : 0;
      const isOverdue = diasRestantes < 0;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Paso 3: Confirma recepción</h3>
          <div style={{ padding: '12px', background: isOverdue ? '#ffebee' : '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ddd' }}>
              <span>Persona que recibe:</span>
              <strong>{selectedLoan?.person?.nombre}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ddd' }}>
              <span>Persona que entrega:</span>
              <strong>{selectedReceiver?.nombre}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ddd' }}>
              <span>Recurso:</span>
              <strong>{selectedLoan?.inventory?.description}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ddd' }}>
              <span>Días transcurridos:</span>
              <strong>{diasPasados}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: isOverdue ? '#d32f2f' : '#388e3c' }}>
              <span>Plazo:</span>
              <strong>
                {selectedLoan?.daysAssigned} días{' '}
                {isOverdue ? `(VENCIDO ${Math.abs(diasRestantes)} días)` : `(${diasRestantes} días restantes)`}
              </strong>
            </div>
          </div>

          {error && <div style={{ color: '#d32f2f', padding: '8px', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setRecepcionStep(2)} style={{ flex: 1, padding: '10px', background: '#f0f0f0' }} disabled={loading}>
              Atrás
            </button>
            <button onClick={handleReceiveLoan} style={{ flex: 1, padding: '10px', background: '#4CAF50', color: 'white' }} disabled={loading}>
              {loading ? 'Procesando...' : '✓ Recibido'}
            </button>
          </div>
        </div>
      );
    }
  };

  // RENDER PRINCIPAL
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {currentMode === 'ENTREGA' ? 'Registrar Préstamo' : 'Recibir Préstamo'}
          </h2>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {currentMode === 'ENTREGA' ? renderEntrega() : renderRecepcion()}
        </div>
      </div>
    </div>
  );
};

export default LoanRegisterModal;
