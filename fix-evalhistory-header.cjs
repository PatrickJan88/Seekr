const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluateHistoryPage.tsx', 'utf8');

code = code.replace(
  `      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-white rounded-full transition-colors flex items-center gap-2 text-[#777c86] hover:text-[#121722] border border-transparent hover:border-[#efefef] cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-xs">{selectedEval ? 'Back to History' : 'Back to Dashboard'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden flex-1 flex flex-col divide-y divide-[#efefef]">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#121722] flex items-center gap-3">
              <Sparkles className="text-[#0068f9]" />
              {selectedEval ? 'Evaluation Details' : 'Evaluation History'}
            </h1>
            <p className="text-[#777c86] text-xs mt-1">
              {selectedEval ? \`Reviewing assessment for \${selectedEval.role}\` : 'Review your past AI assessments'}
            </p>
          </div>
          
          {selectedEval && (
            <button
              onClick={() => onAddToWishlist(selectedEval.result, selectedEval.role)}
              className="text-xs font-medium text-white bg-[#0068f9] hover:bg-[#024bb1] border border-transparent shadow-2xs px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <FolderKanban size={14} />
              <span>Add to Wishlist</span>
            </button>
          )}
        </div>`,
  `      {selectedEval && (
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handleBack}
            className="p-2 bg-white rounded-full transition-colors flex items-center gap-2 text-[#777c86] hover:text-[#121722] border border-[#efefef] hover:bg-[#faf9f7] cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={16} />
            <span className="font-medium text-xs">Back to History</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden flex-1 flex flex-col divide-y divide-[#efefef]">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-[#777c86] text-xs">
              {selectedEval ? \`Reviewing assessment for \${selectedEval.role}\` : 'Review your past AI assessments'}
            </p>
          </div>
          
          {selectedEval && (
            <button
              onClick={() => onAddToWishlist(selectedEval.result, selectedEval.role)}
              className="text-xs font-medium text-white bg-[#0068f9] hover:bg-[#024bb1] border border-transparent shadow-2xs px-4 py-2 rounded-full transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <FolderKanban size={14} />
              <span>Add to Wishlist</span>
            </button>
          )}
        </div>`
);

fs.writeFileSync('src/components/EvaluateHistoryPage.tsx', code);
