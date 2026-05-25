const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

async function requisicao(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
    ...opcoes,
  })

  if (!resposta.ok) {
    const erro = new Error(`Falha ${resposta.status} ao chamar ${caminho}`)
    erro.status = resposta.status
    throw erro
  }

  if (resposta.status === 204) {
    return null
  }

  return resposta.json()
}

export { API_BASE_URL, requisicao }
