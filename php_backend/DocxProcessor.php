<?php
// DocxProcessor for In-Place WordprocessingML (.docx) Parsing and Reconstruction

class DocxProcessor {
    public static function extractElements($docxFilePath) {
        if (!file_exists($docxFilePath)) {
            throw new Exception("File not found at: {$docxFilePath}");
        }

        $zip = new ZipArchive();
        if ($zip->open($docxFilePath) !== true) {
            throw new Exception("Failed to open DOCX zip archive.");
        }

        $docXml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (!$docXml) {
            throw new Exception("word/document.xml not found inside DOCX archive.");
        }

        preg_match('/<w:body>([\s\S]*?)<\/w:body>/', $docXml, $bodyMatch);
        if (!$bodyMatch) {
            throw new Exception("<w:body> element missing from document.xml.");
        }

        $bodyContent = $bodyMatch[1];
        preg_match_all('/<w:tbl[\s\S]*?<\/w:tbl>|<w:p[\s\S]*?<\/w:p>|<w:sectPr[\s\S]*?<\/w:sectPr>/', $bodyContent, $matches);

        $elements = [];
        $tablesCount = 0;
        $paragraphsCount = 0;

        foreach ($matches[0] as $raw) {
            if (strpos($raw, '<w:tbl') === 0) {
                $tablesCount++;
                $elements[] = [
                    'type' => 'table',
                    'raw' => $raw,
                ];
            } elseif (strpos($raw, '<w:sectPr') === 0) {
                $elements[] = [
                    'type' => 'sectPr',
                    'raw' => $raw,
                ];
            } elseif (strpos($raw, '<w:p') === 0) {
                $paragraphsCount++;
                preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $raw, $tMatches);
                $fullText = html_entity_decode(implode('', $tMatches[1] ?? []), ENT_QUOTES | ENT_XML1, 'UTF-8');
                $elements[] = [
                    'type' => 'paragraph',
                    'raw' => $raw,
                    'text' => trim($fullText),
                ];
            }
        }

        return [
            'elements' => $elements,
            'tablesCount' => $tablesCount,
            'paragraphsCount' => $paragraphsCount,
            'totalElements' => count($elements),
        ];
    }

    public static function reconstructInPlace($sourceDocxPath, $outputDocxPath, $humanizedMap) {
        $zip = new ZipArchive();
        if ($zip->open($sourceDocxPath) !== true) {
            throw new Exception("Failed to open source DOCX.");
        }

        $docXml = $zip->getFromName('word/document.xml');
        if (!$docXml) {
            $zip->close();
            throw new Exception("word/document.xml missing in source DOCX.");
        }

        preg_match('/<w:body>([\s\S]*?)<\/w:body>/', $docXml, $bodyMatch);
        $bodyContent = $bodyMatch[1];

        preg_match_all('/<w:tbl[\s\S]*?<\/w:tbl>|<w:p[\s\S]*?<\/w:p>|<w:sectPr[\s\S]*?<\/w:sectPr>/', $bodyContent, $matches);

        $newBodyElements = [];
        $replacedCount = 0;

        foreach ($matches[0] as $raw) {
            if (strpos($raw, '<w:tbl') === 0 || strpos($raw, '<w:sectPr') === 0) {
                $newBodyElements[] = $raw;
                continue;
            }

            if (strpos($raw, '<w:p') === 0) {
                preg_match_all('/<w:t[^>]*>([\s\S]*?)<\/w:t>/', $raw, $tMatches);
                $fullText = trim(html_entity_decode(implode('', $tMatches[1] ?? []), ENT_QUOTES | ENT_XML1, 'UTF-8'));

                if (isset($humanizedMap[$fullText]) && !empty($humanizedMap[$fullText])) {
                    $replacementText = $humanizedMap[$fullText];
                    $replacedCount++;

                    preg_match('/<w:pPr[\s\S]*?<\/w:pPr>/', $raw, $pPrMatch);
                    $pPr = $pPrMatch[0] ?? '';

                    preg_match('/<w:rPr[\s\S]*?<\/w:rPr>/', $raw, $rPrMatch);
                    $rPr = $rPrMatch[0] ?? '';

                    $escapedText = htmlspecialchars($replacementText, ENT_XML1, 'UTF-8');
                    $newParaXml = "<w:p>{$pPr}<w:r>{$rPr}<w:t xml:space=\"preserve\">{$escapedText}</w:t></w:r></w:p>";
                    $newBodyElements[] = $newParaXml;
                } else {
                    $newBodyElements[] = $raw;
                }
            }
        }

        $newBodyXml = '<w:body>' . implode('', $newBodyElements) . '</w:body>';
        $newDocXml = preg_replace('/<w:body>[\s\S]*?<\/w:body>/', $newBodyXml, $docXml, 1);

        $zip->addFromString('word/document.xml', $newDocXml);
        $zip->close();

        // Copy modified zip to destination
        copy($sourceDocxPath, $outputDocxPath);
        
        $targetZip = new ZipArchive();
        $targetZip->open($outputDocxPath);
        $targetZip->addFromString('word/document.xml', $newDocXml);
        $targetZip->close();

        return [
            'filePath' => $outputDocxPath,
            'replacedParagraphs' => $replacedCount,
        ];
    }
}
