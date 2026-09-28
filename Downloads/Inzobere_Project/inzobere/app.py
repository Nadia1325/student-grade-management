import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Inzobere - NLP FAQ Assistant", page_icon="🤖", layout="centered")
st.markdown("<style>.block-container{padding-top:1rem;padding-bottom:0}header,footer{visibility:hidden}</style>", unsafe_allow_html=True)
with open("index.html", encoding="utf-8") as f:
    components.html(f.read(), height=780, scrolling=False)
