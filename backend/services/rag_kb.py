import os
import faiss
import numpy as np
from typing import List, Dict

# Lazy singleton model loader
_model_instance = None
_faiss_index = None
_doc_chunks = []

def get_embedder():
    global _model_instance
    if _model_instance is None:
        from sentence_transformers import SentenceTransformer
        _model_instance = SentenceTransformer('all-MiniLM-L6-v2')
    return _model_instance

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks for RAG."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks or [text]

def rebuild_faiss_index(documents: List[Dict]):
    """Embed all company documents and build FAISS vector index."""
    global _faiss_index, _doc_chunks
    
    embedder = get_embedder()
    all_chunks = []
    
    for doc in documents:
        content = doc.get("content", "")
        title = doc.get("title", "Doc")
        doc_type = doc.get("doc_type", "general")
        
        chunks = chunk_text(content)
        for c in chunks:
            all_chunks.append({
                "title": title,
                "doc_type": doc_type,
                "text": c
            })

    if not all_chunks:
        _faiss_index = None
        _doc_chunks = []
        return

    _doc_chunks = all_chunks
    texts = [c["text"] for c in all_chunks]
    embeddings = embedder.encode(texts, convert_to_numpy=True).astype('float32')

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    _faiss_index = index
    print(f"[RAG KB] Rebuilt FAISS index with {len(all_chunks)} chunks across {len(documents)} documents.")

def retrieve_top_k(query: str, k: int = 3) -> List[Dict]:
    """Retrieve top-k relevant document chunks for a query."""
    global _faiss_index, _doc_chunks
    if _faiss_index is None or not _doc_chunks:
        return []

    embedder = get_embedder()
    query_vector = embedder.encode([query], convert_to_numpy=True).astype('float32')
    
    k_search = min(k, len(_doc_chunks))
    distances, indices = _faiss_index.search(query_vector, k_search)

    results = []
    for idx, dist in zip(indices[0], distances[0]):
        if idx < len(_doc_chunks):
            chunk = _doc_chunks[idx].copy()
            chunk["score"] = float(dist)
            results.append(chunk)
    return results
