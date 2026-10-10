// ============================================================
// ARCHIVO: frontend/hooks/useSearch.ts
// PROPÓSITO: Hook personalizado para la búsqueda inteligente.
//
// QUÉ VA AQUÍ:
//  - Estado: query, results, isLoading, error, activeFilter
//  - Función search(query, filtro?):
//      Aplica debounce de 300ms para no sobrecargar la API
//      Llama a api.busqueda.buscar(query, filtro)
//      Actualiza el estado con los resultados
//  - Función clearSearch(): limpia el estado
//  - Guardar historial de búsquedas en localStorage
//  - Cancelación de requests anteriores con AbortController
//    (si el usuario escribe rápido, cancela el request anterior)
//
// USO:
//  const { query, results, isLoading, search } = useSearch()
//  <input onChange={e => search(e.target.value)} />
// ============================================================

export function useSearch() {
  // TODO: Implementar con useState, useCallback, AbortController
  // TODO: Debounce de 300ms
  return {
    query: '',
    results: { clientes: [], expedientes: [], documentos: [] },
    isLoading: false,
    search: (q: string) => {},
    clearSearch: () => {},
  }
}
