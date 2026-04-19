#!/usr/bin/env python
"""
Test script to verify EngiBuddy chatbot with RAG integration.
Tests different phases and shows RAG context + responses.
"""

import requests
import json
import sys

API_URL = "http://127.0.0.1:8000/chat"

def test_chat(user_message, session_id, test_name):
    """Send a chat message and display the response."""
    print("=" * 75)
    print(f"TEST: {test_name}")
    print("=" * 75)
    print(f"User: {user_message}")
    print()
    
    payload = {
        "userMessage": user_message,
        "sessionId": session_id
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=30)
        result = response.json()
        
        # Show assistant response
        print("CHATBOT RESPONSE:")
        print(f"  {result['assistantMessage']}")
        print()
        
        # Show phase classification
        classification = result.get("classification", {})
        print("PHASE INTELLIGENCE:")
        print(f"  Phase: {classification.get('phase_name')} (ID: {classification.get('phase')})")
        print(f"  Confidence: {classification.get('confidence'):.2%}")
        print(f"  Transition: {classification.get('transition')}")
        print(f"  Reason: {classification.get('reason')}")
        print()
        
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False


if __name__ == "__main__":
    print("\n")
    print("╔" + "=" * 73 + "╗")
    print("║" + " " * 20 + "EngiBuddy Chatbot RAG Integration Test" + " " * 15 + "║")
    print("╚" + "=" * 73 + "╝")
    print()
    
    tests = [
        (
            "How do I interview users effectively?",
            "test-empathize-1",
            "Phase 0: EMPATHIZE - Interview Question (should trigger RAG)"
        ),
        (
            "What is a good problem scope?",
            "test-conceive-1",
            "Phase 1: CONCEIVE - Problem Scope Question"
        ),
        (
            "How should I compare different technologies?",
            "test-design-1",
            "Phase 2: DESIGN - Technology Selection"
        ),
        (
            "My code won't compile. What should I do?",
            "test-implement-1",
            "Phase 3: IMPLEMENT - Debugging Help"
        ),
        (
            "Does my system meet the success criteria?",
            "test-test-1",
            "Phase 4: TEST/REVISE - Validation"
        ),
        (
            "How should I present my project?",
            "test-operate-1",
            "Phase 5: OPERATE - Presentation Prep"
        ),
    ]
    
    success_count = 0
    for user_msg, session_id, test_name in tests:
        if test_chat(user_msg, session_id, test_name):
            success_count += 1
        print()
    
    print("=" * 75)
    print(f"RESULTS: {success_count}/{len(tests)} tests passed")
    print("=" * 75)
