/**
 * Copyright 2017 Vivliostyle Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview Footnotes
 */
goog.provide("vivliostyle.footnote");

goog.require("vivliostyle.pagefloat");

goog.scope(function() {

    /** @const */ var PageFloat = vivliostyle.pagefloat.PageFloat;
    /** @const */ var PageFloatFragment = vivliostyle.pagefloat.PageFloatFragment;

    /**
     * @param {!adapt.vtree.NodePosition} nodePosition
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {string} flowName
     * @constructor
     * @extends vivliostyle.pagefloat.PageFloat
     */
    vivliostyle.footnote.Footnote = function(nodePosition, floatReference, flowName) {
        PageFloat.call(this, nodePosition, floatReference, "block-end", flowName);
    };
    /** @const */ var Footnote = vivliostyle.footnote.Footnote;
    goog.inherits(Footnote, PageFloat);

    /**
     * @override
     */
    Footnote.prototype.isAllowedToPrecede = function(other) {
        return !(other instanceof Footnote);
    };

    /**
     * @param {!vivliostyle.pagefloat.FloatReference} floatReference
     * @param {!Array<!vivliostyle.pagefloat.PageFloatContinuation>} continuations
     * @param {!adapt.vtree.Container} area
     * @constructor
     * @extends PageFloatFragment
     */
    vivliostyle.footnote.FootnoteFragment = function(floatReference, continuations, area) {
        PageFloatFragment.call(this, floatReference, "block-end", continuations, area);
    };
    /** @const */ var FootnoteFragment = vivliostyle.footnote.FootnoteFragment;
    goog.inherits(FootnoteFragment, PageFloatFragment);

    /**
     * @override
     */
    FootnoteFragment.prototype.getOrder = function() {
        return Infinity;
    };

    /**
     * @override
     */
    FootnoteFragment.prototype.shouldBeStashedBefore = function(float) {
        if (float instanceof Footnote) {
            return true;
        } else {
            return this.getOrder() < float.getOrder();
        }
    };

    /**
     * @constructor
     * @implements {vivliostyle.pagefloat.PageFloatLayoutStrategy}
     */
    vivliostyle.pagefloat.FootnoteLayoutStrategy = function() {};
    /** @const */ var FootnoteLayoutStrategy = vivliostyle.pagefloat.FootnoteLayoutStrategy;

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.appliesToNodeContext = function(nodeContext) {
        return nodeContext.floatSide === "footnote";
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.appliesToFloat = function(float) {
        return float instanceof Footnote;
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.createPageFloat = function(
        nodeContext, pageFloatLayoutContext, column) {
        var floatReference = vivliostyle.pagefloat.FloatReference.REGION;
        // If the region context has the same container as the page context,
        // use the page context as the context for the footnote.
        var regionContext = pageFloatLayoutContext.getPageFloatLayoutContext(floatReference);
        var pageContext = pageFloatLayoutContext.getPageFloatLayoutContext(
            vivliostyle.pagefloat.FloatReference.PAGE);
        if (pageContext.hasSameContainerAs(regionContext)) {
            floatReference = vivliostyle.pagefloat.FloatReference.PAGE;
        }
        /** @const */ var nodePosition = nodeContext.toNodePosition();
        goog.asserts.assert(pageFloatLayoutContext.flowName);
        /** @type {!vivliostyle.pagefloat.PageFloat} */ var float =
            new vivliostyle.footnote.Footnote(nodePosition, floatReference,
                pageFloatLayoutContext.flowName);
        pageFloatLayoutContext.addPageFloat(float);
        return adapt.task.newResult(float);
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.createPageFloatFragment = function(
        continuations, floatArea) {
        /** @const */ var f = continuations[0].float;
        return new FootnoteFragment(f.floatReference, continuations, floatArea);
    };

    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.findPageFloatFragment = function(float, pageFloatLayoutContext) {
        var context = pageFloatLayoutContext.getPageFloatLayoutContext(float.floatReference);
        var fragments = context.floatFragments.filter(function(fr) {
            return fr instanceof FootnoteFragment;
        });
        goog.asserts.assert(fragments.length <= 1);
        return fragments[0] || null;
    };


    /**
     * @override
     */
    FootnoteLayoutStrategy.prototype.adjustPageFloatArea = function(floatArea, floatContainer, column) {
        floatArea.isFootnote = true;
        floatArea.adjustContentRelativeSize = false;
        var element = floatArea.element;
        goog.asserts.assert(element);
        floatArea.vertical = column.layoutContext.applyFootnoteStyle(floatContainer.vertical, element);
        floatArea.convertPercentageSizesToPx(element);
        column.setComputedInsets(element, floatArea);
        column.setComputedWidthAndHeight(element, floatArea);
    };

    vivliostyle.pagefloat.PageFloatLayoutStrategyResolver.register(new FootnoteLayoutStrategy());

});