import re
with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useRef } from 'react';")

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
