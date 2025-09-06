// import { useState } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { Check, Lightbulb, Eye, MessageSquare } from 'lucide-react';

// export interface Concept {
//   id: string;
//   name: string;
//   description: string;
//   visual_direction: string;
//   key_message: string;
//   execution_idea: string;
// }

// interface ConceptSelectionProps {
//   concepts: Concept[];
//   onSelectConcept: (conceptId: string) => void;
//   selectedConceptId?: string;
//   loading?: boolean;
// }

// export function ConceptSelection({ 
//   concepts, 
//   onSelectConcept, 
//   selectedConceptId,
//   loading 
// }: ConceptSelectionProps) {
//   const [hoveredConcept, setHoveredConcept] = useState<string | null>(null);

//   if (loading) {
//     return (
//       <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
//         {[1, 2, 3].map((i) => (
//           <div key={i} className="animate-pulse">
//             <div className="h-64 bg-gray-200 rounded-lg"></div>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (!concepts || concepts.length === 0) {
//     return (
//       <div className="py-12 text-center">
//         <Lightbulb className="mx-auto mb-4 w-12 h-12 text-gray-400" />
//         <h3 className="mb-2 text-lg font-medium text-gray-900">No concepts available</h3>
//         <p className="text-gray-600">Generate concepts from your enhanced brief to see them here.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="mb-8 text-center">
//         <h2 className="mb-2 text-3xl font-bold text-gray-900">Choose Your Concept</h2>
//         <p className="text-gray-600">Select the concept that best aligns with your vision</p>
//       </div>

//       <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
//         {concepts.map((concept) => (
//           <motion.div
//             key={concept.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3 }}
//             className="relative"
//           >
//             <div
//               className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ${
//                 selectedConceptId === concept.id
//                   ? 'ring-2 ring-blue-500 shadow-xl'
//                   : hoveredConcept === concept.id
//                   ? 'shadow-xl'
//                   : 'shadow-md'
//               }`}
//               onMouseEnter={() => setHoveredConcept(concept.id)}
//               onMouseLeave={() => setHoveredConcept(null)}
//               onClick={() => onSelectConcept(concept.id)}
//             >
//               {/* Header */}
//               <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-lg font-bold text-white">{concept.name}</h3>
//                   <AnimatePresence>
//                     {selectedConceptId === concept.id && (
//                       <motion.div
//                         initial={{ scale: 0 }}
//                         animate={{ scale: 1 }}
//                         exit={{ scale: 0 }}
//                         className="p-1 bg-white rounded-full"
//                       >
//                         <Check className="w-5 h-5 text-blue-500" />
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>

//               {/* Content */}
//               <div className="p-6 space-y-4">
//                 {/* Description */}
//                 <div>
//                   <div className="flex items-center mb-2">
//                     <Lightbulb className="mr-2 w-4 h-4 text-yellow-500" />
//                     <h4 className="font-semibold text-gray-900">Concept Overview</h4>
//                   </div>
//                   <p className="text-sm leading-relaxed text-gray-600">{concept.description}</p>
//                 </div>

//                 {/* Visual Direction */}
//                 <div>
//                   <div className="flex items-center mb-2">
//                     <Eye className="mr-2 w-4 h-4 text-purple-500" />
//                     <h4 className="font-semibold text-gray-900">Visual Direction</h4>
//                   </div>
//                   <p className="text-sm text-gray-600">{concept.visual_direction}</p>
//                 </div>

//                 {/* Key Message */}
//                 <div>
//                   <div className="flex items-center mb-2">
//                     <MessageSquare className="mr-2 w-4 h-4 text-blue-500" />
//                     <h4 className="font-semibold text-gray-900">Key Message</h4>
//                   </div>
//                   <p className="text-sm italic text-gray-600">"{concept.key_message}"</p>
//                 </div>

//                 {/* Execution Idea */}
//                 <div>
//                   <h4 className="mb-1 font-semibold text-gray-900">Execution</h4>
//                   <p className="text-sm text-gray-600">{concept.execution_idea}</p>
//                 </div>
//               </div>

//               {/* Footer */}
//               <div className="px-6 pb-4">
//                 <button
//                   className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
//                     selectedConceptId === concept.id
//                       ? 'bg-blue-500 text-white'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     onSelectConcept(concept.id);
//                   }}
//                 >
//                   {selectedConceptId === concept.id ? 'Selected' : 'Select Concept'}
//                 </button>
//               </div>
//             </div>

//             {/* Hover Effect Overlay */}
//             <AnimatePresence>
//               {hoveredConcept === concept.id && selectedConceptId !== concept.id && (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl pointer-events-none"
//                 />
//               )}
//             </AnimatePresence>
//           </motion.div>
//         ))}
//       </div>

//       {selectedConceptId && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="p-4 mt-8 bg-blue-50 rounded-lg"
//         >
//           <div className="flex items-center">
//             <Check className="mr-2 w-5 h-5 text-blue-500" />
//             <span className="font-medium text-blue-700">
//               Concept selected! Ready to generate reference image.
//             </span>
//           </div>
//         </motion.div>
//       )}
//     </div>
//   );
// }

// // Concept Card Component for smaller displays
// export function ConceptCard({ concept, isSelected, onSelect }: {
//   concept: Concept;
//   isSelected: boolean;
//   onSelect: () => void;
// }) {
//   return (
//     <div
//       className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all ${
//         isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:shadow-lg'
//       }`}
//       onClick={onSelect}
//     >
//       <div className="flex justify-between items-start mb-2">
//         <h4 className="font-semibold text-gray-900">{concept.name}</h4>
//         {isSelected && <Check className="w-4 h-4 text-blue-500" />}
//       </div>
//       <p className="mb-2 text-sm text-gray-600">{concept.description}</p>
//       <div className="text-xs text-gray-500">
//         <p><strong>Visual:</strong> {concept.visual_direction}</p>
//         <p><strong>Message:</strong> {concept.key_message}</p>
//       </div>
//     </div>
//   );
// }