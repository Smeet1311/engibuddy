#!/usr/bin/env python
"""
Show what RAG context is retrieved for different queries and phases.
"""
import sys
import os
sys.path.insert(0, 'd:/engibuddy/backend')
os.chdir('d:/engibuddy/backend')

from rag import retrieve_context

print("=" * 80)
print("RAG CONTEXT RETRIEVAL TEST - What knowledge gets injected?")
print("=" * 80)
print()

queries = [
    ("How do I interview users effectively?", 0, "Phase 0: Empathize"),
    ("What is a good problem scope?", 1, "Phase 1: Conceive"),
    ("How should I compare different technologies?", 2, "Phase 2: Design"),
    ("My code won't compile.", 3, "Phase 3: Implement"),
    ("Does my system meet success criteria?", 4, "Phase 4: Test/Revise"),
    ("How should I present my project?", 5, "Phase 5: Operate"),
]

for user_msg, phase_id, phase_name in queries:
    context = retrieve_context(user_msg, phase_id)
    
    print(f"\n{'─' * 80}")
    print(f"QUERY: '{user_msg}'")
    print(f"PHASE: {phase_name}")
    print(f"{'─' * 80}")
    
    if context:
        # Show first 400 chars of context
        preview = context[:400] if len(context) > 400 else context
        if len(context) > 400:
            preview += "\n[...trimmed...]"
        print(f"✓ RAG CONTEXT FOUND ({len(context)} chars total):")
        print(preview)
    else:
        print("✗ RAG CONTEXT: (no relevant context found - OpenAI alone will respond)")

print("\n" + "=" * 80)
print("ANALYSIS:")
print("=" * 80)
print("""
When RAG retrieves context, it gets prepended to the system prompt like this:

    BASE_PERSONALITY + PHASE_PROMPTS[phase]
    +
    "--- Reference context from knowledge base: {retrieved_context} ---"

This helps the chatbot:
1. Stay consistent with PBL framework
2. Reference specific project guidelines
3. Provide students with structured knowledge without direct answers

Without RAG: Chatbot relies on Base System Prompt + Phase Rules
With RAG: Chatbot adds specific knowledge base insights
""")
